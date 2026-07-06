import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, ImageBackground, Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Notifications from "expo-notifications";
import {
  Store, Clock3, IndianRupee, Users, ChefHat, ShoppingBag,
  CheckCircle, XCircle, RefreshCw, AlertTriangle, Building2,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import OptimizedImage, { OptimizedBackground } from "../../components/OptimizedImage";
import { getVendorOrders, updateOrderStatus, getMyRestaurant, getMyRestaurants, getLowStockItems } from "../../services/vendorService";
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
  const [requestOrder, setRequestOrder] = useState(null);
  const [requestUpdating, setRequestUpdating] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [multiRestaurants, setMultiRestaurants] = useState([]);
  const [showOutletPicker, setShowOutletPicker] = useState(false);
  const knownOrderIds = useRef(new Set());

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const loadData = useCallback(async () => {
    try {
      const [rest, allRestaurants, orderRes, lowStockRes] = await Promise.all([
        getMyRestaurant(),
        getMyRestaurants(),
        getVendorOrders(),
        getLowStockItems(10).catch((err) => {
          Alert.alert("Inventory unavailable", err.message || "Could not load low-stock items.");
          return [];
        }),
      ]);
      const loadedOrders = orderRes.orders || [];
      setMultiRestaurants(allRestaurants);
      setRestaurant(rest);
      setOrders(loadedOrders);
      setLowStockItems(Array.isArray(lowStockRes) ? lowStockRes : []);
      loadedOrders.forEach((o) => knownOrderIds.current.add(o.id));
    } catch (err) {
      console.error("Vendor load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch((err) => {
      Alert.alert("Notifications unavailable", err.message || "Could not request notification permission.");
    });
  }, []);

  useEffect(() => {
    loadData();
    const socket = connectSocket();

    const handleNewOrder = (order) => {
      if (order.restaurantId === restaurant?.id) {
        setOrders((prev) => [order, ...prev]);
        if (!knownOrderIds.current.has(order.id)) {
          knownOrderIds.current.add(order.id);
          setRequestOrder(order);
          Notifications.scheduleNotificationAsync({
            content: {
              title: "New Order Received!",
              body: `Order from ${order.user?.name || order.customerName || "Customer"} — ₹${order.total || 0}`,
              sound: true,
            },
            trigger: null,
          }).catch((err) => {
            Alert.alert("Notification failed", err.message || "Could not show the new-order notification.");
          });
        }
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

  const handleRequestAction = async (orderId, status) => {
    setRequestUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      setRequestOrder(null);
    } catch (err) {
      Alert.alert("Error", "Failed to update order");
    } finally {
      setRequestUpdating(null);
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
        <OptimizedBackground
          source={restaurant?.imageUrl ? { uri: restaurant.imageUrl } : undefined}
          className="pt-16 pb-6 px-4 rounded-b-[28px] overflow-hidden"
        >
          <View className="absolute inset-0 bg-indigo-950/75 rounded-b-[28px]" />
          <View className="relative">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center border border-white/30">
                  <Store size={28} color="#fff" />
                </View>
                <View className="flex-1">
                  <TouchableOpacity onPress={() => multiRestaurants.length > 1 && setShowOutletPicker(true)}
                    className="flex-row items-center gap-1">
                    <Text className="text-xl font-extrabold text-white drop-shadow-lg" numberOfLines={1}>
                      {restaurant?.name || "Vendor Dashboard"}
                    </Text>
                    {multiRestaurants.length > 1 ? <Building2 size={16} color="#a5b4fc" /> : null}
                  </TouchableOpacity>
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
        </OptimizedBackground>

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
                const fields = [restaurant.name, restaurant.cuisine, restaurant.phone, restaurant.imageUrl, restaurant.addressLine1, restaurant.city, restaurant.state, restaurant.postalCode, restaurant.fssaiNumber];
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

        {lowStockItems.length > 0 ? (
          <TouchableOpacity className="mx-4 mt-4 bg-amber-50 rounded-2xl p-4 border-l-4 border-amber-500 flex-row items-center gap-3">
            <AlertTriangle size={20} color="#d97706" />
            <View className="flex-1">
              <Text className="font-bold text-amber-800">{lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} low in stock</Text>
              <Text className="text-xs text-amber-700">{lowStockItems.map((i) => i.name).join(", ")}</Text>
            </View>
          </TouchableOpacity>
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

      {/* Multi-outlet Picker */}
      <Modal visible={showOutletPicker} animationType="slide" transparent onRequestClose={() => setShowOutletPicker(false)}>
        <View className="flex-1 bg-black/50">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowOutletPicker(false)} />
          <View className="bg-white rounded-t-3xl px-5 pb-8 pt-4">
            <Text className="text-lg font-black text-slate-900 mb-4">Select Outlet</Text>
            {multiRestaurants.map((r) => (
              <TouchableOpacity key={r.id} onPress={() => { setRestaurant(r); setShowOutletPicker(false); }}
                className={`flex-row items-center gap-4 p-4 rounded-2xl mb-2 ${r.id === restaurant?.id ? "bg-indigo-50 border border-indigo-200" : "bg-slate-50"}`}>
                <View className="h-10 w-10 rounded-xl bg-indigo-100 items-center justify-center">
                  <Store size={20} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900">{r.name}</Text>
                  <Text className="text-xs text-slate-500">{r.city}{r.isOpen ? " • Open" : " • Closed"}</Text>
                </View>
                {r.id === restaurant?.id ? <CheckCircle size={18} color="#6366f1" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Order Request Popup */}
      <Modal visible={!!requestOrder} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-xl">
            <View className="items-center mb-4">
              <View className="h-16 w-16 rounded-2xl bg-rose-100 items-center justify-center mb-3">
                <ShoppingBag size={32} color="#e11d48" />
              </View>
              <Text className="text-xl font-extrabold text-slate-900">New Order!</Text>
              <Text className="text-sm text-slate-500">You have a new incoming order</Text>
            </View>
            {requestOrder ? (
              <>
                <View className="bg-slate-50 rounded-2xl p-4 mb-4 gap-2">
                  <Text className="text-sm">
                    <Text className="font-bold">Customer: </Text>
                    {requestOrder.user?.name || requestOrder.customerName || "Customer"}
                  </Text>
                  <Text className="text-sm">
                    <Text className="font-bold">Items: </Text>
                    {requestOrder.items?.map?.((i) => `${i.name || i.menuItem?.name} x${i.quantity}`).join(", ") || `${requestOrder.itemCount || 0} items`}
                  </Text>
                  <Text className="text-sm">
                    <Text className="font-bold">Total: </Text>
                    ₹{requestOrder.total || 0}
                  </Text>
                  <Text className="text-sm">
                    <Text className="font-bold">Time: </Text>
                    {requestOrder.createdAt ? new Date(requestOrder.createdAt).toLocaleString() : ""}
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    disabled={requestUpdating === requestOrder.id}
                    onPress={() => handleRequestAction(requestOrder.id, "REJECTED")}
                    className="flex-1 flex-row items-center justify-center gap-1 h-12 rounded-2xl bg-rose-500"
                  >
                    <XCircle size={18} color="#fff" />
                    <Text className="text-sm font-extrabold text-white">
                      {requestUpdating === requestOrder.id ? "..." : "Reject"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={requestUpdating === requestOrder.id}
                    onPress={() => handleRequestAction(requestOrder.id, "ACCEPTED")}
                    className="flex-1 flex-row items-center justify-center gap-1 h-12 rounded-2xl bg-emerald-500"
                  >
                    <CheckCircle size={18} color="#fff" />
                    <Text className="text-sm font-extrabold text-white">
                      {requestUpdating === requestOrder.id ? "..." : "Accept"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
            {requestOrder && !requestUpdating ? (
              <TouchableOpacity
                onPress={() => setRequestOrder(null)}
                className="items-center mt-3"
              >
                <Text className="text-sm font-bold text-slate-400">Dismiss</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}


import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Linking,
} from "react-native";
import {
  ShoppingBag, ChefHat, Clock3, IndianRupee, User, Store, MessageCircle,
  CheckCircle, XCircle, ChevronLeft, Eye, Phone,
} from "lucide-react-native";
import { colors } from "../../constants/colors";
import { getVendorOrders, updateOrderStatus } from "../../services/vendorService";
import { connectSocket, disconnectSocket } from "../../services/chatSocket";

const STATUS_MAP = {
  PENDING: { label: "Pending", color: "text-rose-600 bg-rose-50" },
  ACCEPTED: { label: "Accepted", color: "text-indigo-600 bg-indigo-50" },
  PREPARING: { label: "Preparing", color: "text-amber-600 bg-amber-50" },
  READY_FOR_PICKUP: { label: "Ready", color: "text-emerald-600 bg-emerald-50" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-blue-600 bg-blue-50" },
  DELIVERED: { label: "Delivered", color: "text-emerald-600 bg-emerald-50" },
  CANCELLED: { label: "Cancelled", color: "text-slate-600 bg-slate-50" },
  REJECTED: { label: "Rejected", color: "text-rose-600 bg-rose-50" },
};

const filters = ["All", "PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "DELIVERED", "CANCELLED"];

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};

const riderChatStatuses = ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];

export default function OrderPanelScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "All" ? { status: filter } : {};
      const res = await getVendorOrders(params);
      setOrders(res.orders || []);
    } catch (err) {
      console.error("Order panel load error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadOrders();
    const socket = connectSocket();
    const handleStatusUpdate = ({ orderId, status }) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    };
    socket.on("order:status-updated", handleStatusUpdate);
    return () => {
      socket.off("order:status-updated", handleStatusUpdate);
      disconnectSocket();
    };
  }, [loadOrders]);

  const stats = useMemo(() => ({
    pending: orders.filter((o) => o.status === "PENDING").length,
    processing: orders.filter((o) => ["ACCEPTED", "PREPARING"].includes(o.status)).length,
    ready: orders.filter((o) => o.status === "READY_FOR_PICKUP").length,
  }), [orders]);

  const handleAction = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch { Alert.alert("Error", "Failed to update"); }
    finally { setUpdating(null); }
  };

  const getActions = (status) => {
    switch (status) {
      case "PENDING": return [
        { label: "Reject", status: "REJECTED", color: "bg-rose-500", icon: XCircle },
        { label: "Accept", status: "ACCEPTED", color: "bg-emerald-500", icon: CheckCircle },
      ];
      case "ACCEPTED": return [
        { label: "Start Preparing", status: "PREPARING", color: "bg-amber-500", icon: CheckCircle },
      ];
      case "PREPARING": return [
        { label: "Mark Ready", status: "READY_FOR_PICKUP", color: "bg-indigo-500", icon: CheckCircle },
      ];
      default: return [];
    }
  };

  const formatCurrency = (amount) => `Rs ${Number(amount || 0).toFixed(0)}`;
  const canChatWithRider = (order) => Boolean(order.rider?.id || order.riderId) && riderChatStatuses.includes(order.status);

  return (
    <View className="flex-1">
      <View className="bg-white shadow-sm pt-14 pb-4 px-4">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ChevronLeft size={20} color={colors.slate[900]} />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-slate-900">Order Panel</Text>
        </View>
      </View>
      <ScrollView className="flex-1">
        {/* Stats cards */}
        <View className="flex-row gap-3 px-4 mt-4">
          <TouchableOpacity onPress={() => setFilter("PENDING")}
            className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-slate-500 font-medium">Pending</Text>
                <Text className="text-2xl font-extrabold text-rose-600 mt-1">{stats.pending}</Text>
              </View>
              <View className="bg-rose-50 p-3 rounded-xl">
                <Clock3 size={22} color="#e11d48" />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter("ACCEPTED")}
            className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-slate-500 font-medium">Processing</Text>
                <Text className="text-2xl font-extrabold text-blue-600 mt-1">{stats.processing}</Text>
              </View>
              <View className="bg-blue-50 p-3 rounded-xl">
                <ShoppingBag size={22} color="#2563eb" />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilter("READY_FOR_PICKUP")}
            className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-slate-500 font-medium">Ready</Text>
                <Text className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.ready}</Text>
              </View>
              <View className="bg-emerald-50 p-3 rounded-xl">
                <CheckCircle size={22} color="#059669" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-3" contentContainerStyle={{ gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              className={`rounded-full px-5 py-2 ${filter === f ? "bg-indigo-600" : "bg-white border border-slate-200"}`}>
              <Text className={`text-xs font-extrabold ${filter === f ? "text-white" : "text-slate-700"}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-4 space-y-4 pb-8">
          {loading ? (
            <ActivityIndicator size="large" color={colors.brand[600]} style={{ marginTop: 20 }} />
          ) : orders.length === 0 ? (
            <View className="items-center py-16">
              <ChefHat size={48} color="#94a3b8" />
              <Text className="text-base font-bold text-slate-500 mt-4">No orders found</Text>
            </View>
          ) : (
            orders.map((order) => {
              const si = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
              const [textColor, bgColor] = si.color.split(" ");
              const actions = getActions(order.status);
              return (
                <View key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className={`h-10 w-10 rounded-xl items-center justify-center ${bgColor}`}>
                        <ShoppingBag size={20} color={textColor === "text-white" ? "#fff" : colors.slate[700]} />
                      </View>
                      <View>
                        <Text className="font-extrabold text-slate-900">#{order.id?.slice(-6)}</Text>
                        <Text className="text-xs text-slate-500">{order.user?.name || order.customer?.name || order.customerName || "Customer"}</Text>
                        <Text className="text-[10px] text-slate-400">{formatTime(order.createdAt)}</Text>
                      </View>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${bgColor}`}>
                      <Text className={`text-xs font-extrabold ${textColor}`}>{si.label}</Text>
                    </View>
                  </View>

                  <View className="mt-3 space-y-1">
                    {(order.items || []).map((item) => (
                      <View key={item.id} className="flex-row justify-between items-center">
                        <Text className="text-sm text-slate-700 flex-1">
                          {item.quantity}x {item.name || item.menuItem?.name}
                        </Text>
                        <Text className="text-sm font-semibold text-slate-700">{formatCurrency(item.unitPrice || item.totalPrice)}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <View className="flex-row items-center gap-1">
                      <IndianRupee size={14} color={colors.slate[700]} />
                      <Text className="text-lg font-extrabold text-slate-900">{formatCurrency(order.total || order.totalAmount || 0)}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => setSelectedOrder(order)}
                        className="h-9 px-3 rounded-xl bg-slate-100 flex-row items-center gap-1">
                        <Eye size={14} color={colors.slate[600]} />
                        <Text className="text-xs font-bold text-slate-600">View</Text>
                      </TouchableOpacity>
                      {actions.map((action) => (
                        <TouchableOpacity key={action.status}
                          disabled={updating === order.id}
                          onPress={() => handleAction(order.id, action.status)}
                          className={`flex-row items-center gap-1 h-9 px-4 rounded-xl ${action.color}`}>
                          <action.icon size={14} color="#fff" />
                          <Text className="text-xs font-extrabold text-white">
                            {updating === order.id ? "..." : action.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(order.status) && (
                        <>
                          <TouchableOpacity
                            onPress={() => navigation.navigate("VendorChat", { orderId: order.id, room: "vendor" })}
                            className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                            <MessageCircle size={16} color="#059669" />
                          </TouchableOpacity>
                          {canChatWithRider(order) && (
                            <TouchableOpacity
                              onPress={() => navigation.navigate("VendorChat", { orderId: order.id, room: "rider" })}
                              className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                              <MessageCircle size={16} color={colors.slate[600]} />
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10 max-h-[80%]">
            {selectedOrder ? (
              <ScrollView>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-extrabold text-slate-900">
                    Order #{selectedOrder.id?.slice(-6)}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                    <Text className="text-sm font-bold text-indigo-600">Close</Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3 mb-4 bg-slate-50 rounded-2xl p-4">
                  <Text className="text-sm"><Text className="font-bold">Customer:</Text> {selectedOrder.user?.name || selectedOrder.customer?.name || selectedOrder.customerName || "NA"}</Text>
                  <Text className="text-sm"><Text className="font-bold">Phone:</Text> {selectedOrder.user?.phone || selectedOrder.customer?.phone || "NA"}</Text>
                  <Text className="text-sm"><Text className="font-bold">Address:</Text> {selectedOrder.address?.line1 || selectedOrder.deliveryAddress || "NA"}</Text>
                  <Text className="text-sm"><Text className="font-bold">Payment:</Text> {selectedOrder.paymentMethod || "NA"}</Text>
                  <Text className="text-sm"><Text className="font-bold">Time:</Text> {formatTime(selectedOrder.createdAt)}</Text>
                  {selectedOrder.rider?.name ? (
                    <Text className="text-sm"><Text className="font-bold">Rider:</Text> {selectedOrder.rider.name} {selectedOrder.rider.phone ? `(${selectedOrder.rider.phone})` : ""}</Text>
                  ) : null}
                </View>

                <Text className="font-extrabold text-slate-900 mb-2">Items</Text>
                <View className="bg-white rounded-2xl border border-slate-100 p-3 mb-4">
                  {(selectedOrder.items || []).map((item) => (
                    <View key={item.id} className="py-2 border-b border-slate-50 last:border-b-0">
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-slate-800">
                          {item.quantity}x {item.name || item.menuItem?.name}
                        </Text>
                        <Text className="text-sm font-semibold text-slate-800">{formatCurrency(item.totalPrice)}</Text>
                      </View>
                      {item.selectedSideDishes?.length > 0 ? (
                        <Text className="text-xs text-amber-600 ml-3 mt-1">
                          + Side: {item.selectedSideDishes.map((sd) => `${sd.name} (${formatCurrency(Number(sd.price))})`).join(", ")}
                        </Text>
                      ) : null}
                      {item.notes ? (
                        <Text className="text-xs text-slate-500 italic ml-3">Note: {item.notes}</Text>
                      ) : null}
                    </View>
                  ))}
                  <View className="flex-row justify-between pt-2 mt-1 border-t border-slate-100">
                    <Text className="text-sm font-extrabold text-slate-900">Total</Text>
                    <Text className="text-sm font-extrabold text-slate-900">{formatCurrency(selectedOrder.total || selectedOrder.totalAmount || 0)}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  {(selectedOrder.user?.phone || selectedOrder.customer?.phone) ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${selectedOrder.user?.phone || selectedOrder.customer?.phone}`)}
                      className="flex-1 flex-row items-center justify-center gap-1 bg-blue-600 rounded-xl py-3"
                    >
                      <Phone size={16} color="#fff" />
                      <Text className="text-sm font-extrabold text-white">Call Customer</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => {
                      const id = selectedOrder.id;
                      setSelectedOrder(null);
                      navigation.navigate("VendorChat", { orderId: id, room: "vendor" });
                    }}
                    className="flex-1 flex-row items-center justify-center gap-1 bg-emerald-600 rounded-xl py-3"
                  >
                    <MessageCircle size={16} color="#fff" />
                    <Text className="text-sm font-extrabold text-white">Chat</Text>
                  </TouchableOpacity>
                  {canChatWithRider(selectedOrder) ? (
                    <TouchableOpacity
                      onPress={() => {
                        const id = selectedOrder.id;
                        setSelectedOrder(null);
                        navigation.navigate("VendorChat", { orderId: id, room: "rider" });
                      }}
                      className="flex-1 flex-row items-center justify-center gap-1 bg-slate-800 rounded-xl py-3"
                    >
                      <MessageCircle size={16} color="#fff" />
                      <Text className="text-sm font-extrabold text-white">Rider</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
